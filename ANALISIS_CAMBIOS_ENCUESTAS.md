# Análisis y Plan de Implementación: Nuevo Sistema de Encuestas

## 📋 Requerimientos

### 1. Flujo de Encuestas
- Cuando una orden se entrega → Mostrar modal "Esperando confirmación de encuesta"
- Paciente solo puede regresar al menú, NO puede crear nuevas órdenes
- Solo la enfermera puede crear órdenes desde el panel
- La enfermera habilita la encuesta manualmente desde el panel
- Una vez habilitada, el paciente puede contestar la encuesta

### 2. Contenido de la Encuesta
La encuesta tiene **3 secciones**:
1. **Calificación de Productos**: Cada producto ordenado recibe calificación 0-5 estrellas
2. **Calificación de Enfermera**: Calificación 0-5 estrellas para la interacción con el personal asignado
3. **Calificación de Estancia**: Calificación 0-5 estrellas para la estancia en el lugar

### 3. Promedio de Productos
- Las calificaciones de productos se promedian
- El promedio se muestra en las cards del menú (ProductCard)

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### 1. Modelo `Patient` (`clinic/models.py`)
```python
# Agregar campo email (opcional)
email = models.EmailField(
    _('email'),
    blank=True,
    null=True,
    help_text=_('Patient email address (optional)')
)
```

### 2. Modelo `PatientAssignment` (`clinic/models.py`)
```python
# Control de encuesta
survey_enabled = models.BooleanField(
    _('survey enabled'),
    default=False,
    help_text=_('Whether survey is enabled for this patient assignment')
)
survey_enabled_at = models.DateTimeField(
    _('survey enabled at'),
    null=True,
    blank=True,
    help_text=_('When the survey was enabled')
)
# Flag para bloquear nuevas órdenes del paciente
can_patient_order = models.BooleanField(
    _('can patient order'),
    default=True,
    help_text=_('Whether patient can create new orders')
)
```

### 3. Modelo `Feedback` (`feedbacks/models.py`)
```python
# Cambiar de OneToOne a ForeignKey (un paciente puede tener múltiples feedbacks)
patient_assignment = models.ForeignKey(
    'clinic.PatientAssignment',
    on_delete=models.CASCADE,
    related_name='feedbacks',
    verbose_name=_('patient assignment'),
    help_text=_('Patient assignment this feedback is for')
)

# Remover satisfacción_rating general, ahora son específicos
# Calificaciones de productos (JSONField)
product_ratings = models.JSONField(
    _('product ratings'),
    default=dict,
    blank=True,
    help_text=_('Ratings for each product ordered: {product_id: rating (0-5)}')
)

# Calificación de enfermera
staff_rating = models.IntegerField(
    validators=[MinValueValidator(0), MaxValueValidator(5)],
    verbose_name=_('staff rating'),
    help_text=_('Rating for staff interaction (0-5 stars)')
)

# Calificación de estancia
stay_rating = models.IntegerField(
    validators=[MinValueValidator(0), MaxValueValidator(5)],
    verbose_name=_('stay rating'),
    help_text=_('Rating for stay experience (0-5 stars)')
)

# Remover satisfaction_rating (ya no se usa)
```

### 4. Modelo `Product` (`catalog/models.py`)
```python
# Agregar campo calculado para rating promedio
# Esto se puede calcular dinámicamente o guardarse en caché
rating_average = models.DecimalField(
    _('rating average'),
    max_digits=3,
    decimal_places=2,
    default=0.00,
    help_text=_('Average rating from product feedbacks (0-5)')
)
rating_count = models.IntegerField(
    _('rating count'),
    default=0,
    help_text=_('Number of ratings received')
)
```

---

## 🔧 CAMBIOS EN BACKEND

### 1. Serializers (`clinic/serializers.py`)
- Actualizar `PatientSerializer` para incluir `email`
- Actualizar `PatientAssignmentSerializer` para incluir `survey_enabled`, `survey_enabled_at`, `can_patient_order`

### 2. Serializers (`feedbacks/serializers.py`)
```python
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = [
            'id',
            'patient_assignment',
            'product_ratings',
            'staff_rating',
            'stay_rating',
            'comment',
            'created_at'
        ]
```

### 3. Endpoints (`clinic/views.py`)
```python
# En PatientAssignmentViewSet
@action(detail=True, methods=['post'])
def enable_survey(self, request, pk=None):
    """Enable survey for patient assignment"""
    assignment = self.get_object()
    if not assignment.is_active:
        return Response(
            {'error': 'Assignment is not active'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    assignment.survey_enabled = True
    assignment.survey_enabled_at = timezone.now()
    assignment.can_patient_order = False  # Bloquear nuevas órdenes
    assignment.save()
    
    # Notificar vía WebSocket
    # ...
    
    return Response({'status': 'Survey enabled'})

@action(detail=True, methods=['post'])
def block_patient_orders(self, request, pk=None):
    """Block patient from creating new orders"""
    assignment = self.get_object()
    assignment.can_patient_order = False
    assignment.save()
    return Response({'status': 'Patient orders blocked'})
```

### 4. Validación de Creación de Órdenes (`orders/views.py`)
```python
# En create_order_public
# Verificar si can_patient_order es False
if patient_assignment and not patient_assignment.can_patient_order:
    return Response(
        {'error': 'No puedes crear nuevas órdenes. Espera la confirmación de encuesta.'},
        status=status.HTTP_403_FORBIDDEN
    )
```

### 5. Cálculo de Promedio de Productos (`feedbacks/views.py` o `catalog/signals.py`)
```python
# Signal o método para actualizar rating promedio cuando se crea feedback
@receiver(post_save, sender=Feedback)
def update_product_ratings(sender, instance, created, **kwargs):
    if created and instance.product_ratings:
        for product_id, rating in instance.product_ratings.items():
            product = Product.objects.get(id=product_id)
            # Calcular promedio actualizado
            all_ratings = []
            for feedback in Feedback.objects.filter(
                product_ratings__has_key=str(product_id)
            ):
                if str(product_id) in feedback.product_ratings:
                    all_ratings.append(feedback.product_ratings[str(product_id)])
            
            if all_ratings:
                product.rating_average = sum(all_ratings) / len(all_ratings)
                product.rating_count = len(all_ratings)
                product.save()
```

---

## 💻 CAMBIOS EN FRONTEND

### 1. Kiosk - Modal "Esperando Confirmación" (`KioskOrdersPage.tsx`)

```typescript
// Nuevo modal
const [waitingForSurveyModal, setWaitingForSurveyModal] = useState(false);

// Cuando orden se entrega
if (message.status === 'DELIVERED') {
  setWaitingForSurveyModal(true);
  // NO mostrar encuesta todavía
}

// Modal de espera
<WaitingForSurveyModal
  show={waitingForSurveyModal && !patientAssignment?.survey_enabled}
  onClose={() => {/* Solo puede cerrar si quiere volver al menú */}}
  onBackToMenu={() => navigate(`/kiosk/${deviceId}`)}
/>
```

### 2. Kiosk - Bloquear Creación de Órdenes (`KioskHomePage.tsx`, `KioskCategoryPage.tsx`)

```typescript
// Verificar si puede ordenar
const canOrder = patientAssignment?.can_patient_order ?? true;

// Deshabilitar botones de agregar al carrito si canOrder es false
// Mostrar mensaje: "Espera la confirmación de encuesta para ordenar"
```

### 3. Kiosk - Nueva Encuesta Completa (`components/kiosk/CompleteSurveyModal.tsx`)

**NUEVO COMPONENTE** con 3 secciones:

1. **Sección 1: Calificación de Productos**
```typescript
{order.items.map((item) => (
  <div key={item.id}>
    <p>{item.product_name}</p>
    <StarRating
      rating={productRatings[item.product_id] || 0}
      onChange={(rating) => 
        setProductRatings({...productRatings, [item.product_id]: rating})
      }
    />
  </div>
))}
```

2. **Sección 2: Calificación de Enfermera**
```typescript
<StarRating
  rating={staffRating}
  onChange={setStaffRating}
  label="Califica la atención de tu enfermera"
/>
```

3. **Sección 3: Calificación de Estancia**
```typescript
<StarRating
  rating={stayRating}
  onChange={setStayRating}
  label="Califica tu estancia"
/>
```

### 4. Kiosk - Mostrar Encuesta cuando esté Habilitada (`KioskOrdersPage.tsx`)

```typescript
// Polling o WebSocket para verificar survey_enabled
useEffect(() => {
  const checkSurveyStatus = async () => {
    if (patientAssignment?.survey_enabled && !surveyCompleted) {
      setShowCompleteSurvey(true);
    }
  };
  
  const interval = setInterval(checkSurveyStatus, 2000);
  return () => clearInterval(interval);
}, [patientAssignment]);
```

### 5. Panel de Enfermería - Habilitar Encuesta (`DashboardPage.tsx`)

```typescript
// Botón "Habilitar Encuesta"
const handleEnableSurvey = async () => {
  await apiClient.post(
    `/clinic/patient-assignments/${activeAssignment.id}/enable_survey/`
  );
  // Recargar datos
  loadData();
};

// Mostrar estado de encuesta
{activeAssignment.survey_enabled ? (
  <Badge>Encuesta Habilitada</Badge>
) : (
  <Button onClick={handleEnableSurvey}>Habilitar Encuesta</Button>
)}
```

### 6. Panel de Enfermería - Bloquear Órdenes del Paciente

- Automático cuando se habilita la encuesta
- Mostrar indicador visual

### 7. Product Cards - Mostrar Rating Promedio (`ProductCard.tsx`)

```typescript
// Mostrar estrellas basadas en product.rating_average
<div style={styles.rating}>
  {[...Array(5)].map((_, i) => (
    <span key={i}>
      {i < Math.floor(product.rating_average) ? '★' : '☆'}
    </span>
  ))}
  <span>{product.rating_average.toFixed(1)} ({product.rating_count})</span>
</div>
```

---

## 📱 FLUJO COMPLETO

### Escenario 1: Orden Entregada

1. Enfermera marca orden como DELIVERED
2. **Kiosk**: Se muestra modal "Esperando confirmación de encuesta"
3. **Kiosk**: Bloqueo de creación de nuevas órdenes
4. Paciente solo puede ver menú (sin poder ordenar) o regresar a órdenes

### Escenario 2: Enfermera Habilita Encuesta

1. Enfermera hace clic en "Habilitar Encuesta"
2. Backend actualiza `survey_enabled = True` y `can_patient_order = False`
3. **Kiosk**: Detecta cambio (polling o WebSocket)
4. **Kiosk**: Muestra modal de encuesta completa (3 secciones)

### Escenario 3: Paciente Completa Encuesta

1. Paciente califica productos (0-5 estrellas cada uno)
2. Paciente califica enfermera (0-5 estrellas)
3. Paciente califica estancia (0-5 estrellas)
4. Se envía feedback al backend
5. Backend calcula promedios de productos
6. Se actualizan ratings en productos
7. Productos muestran nuevos promedios en cards

---

## 🔄 ORDEN DE IMPLEMENTACIÓN

### Fase 1: Backend - Modelos y Migraciones
1. Modificar modelos (Patient, PatientAssignment, Feedback, Product)
2. Crear migraciones
3. Ejecutar migraciones

### Fase 2: Backend - API y Lógica
1. Actualizar serializers
2. Crear endpoints para habilitar encuesta
3. Validación para bloquear órdenes
4. Lógica de cálculo de promedios

### Fase 3: Frontend - Kiosk
1. Modal "Esperando confirmación"
2. Bloquear creación de órdenes
3. Nueva encuesta completa (3 secciones)
4. Detectar cuando encuesta está habilitada

### Fase 4: Frontend - Panel Enfermería
1. Botón habilitar encuesta
2. Indicadores de estado

### Fase 5: Frontend - Product Cards
1. Mostrar rating promedio
2. Actualizar visualmente

---

## 📝 NOTAS IMPORTANTES

1. **WebSocket**: Considerar agregar evento `survey_enabled` para notificar en tiempo real
2. **Validación**: Asegurar que todos los productos tengan calificación antes de enviar
3. **UX**: Hacer claro al paciente que debe esperar la encuesta
4. **Performance**: El cálculo de promedios puede ser pesado, considerar caché o background task

---

## ❓ Preguntas para Aclarar

1. ¿La encuesta es por orden o por asignación completa? (Asumimos por asignación)
2. ¿El paciente puede ver el menú pero no ordenar, o debe quedarse en la página de órdenes?
3. ¿Las calificaciones de productos afectan solo a esa orden o a todas las órdenes del paciente?
4. ¿Qué pasa si hay múltiples órdenes entregadas antes de habilitar la encuesta?
