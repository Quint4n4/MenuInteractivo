from rest_framework import serializers
from .models import ProductCategory, Product, ProductTag


class ProductTagSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductTag model
    """
    class Meta:
        model = ProductTag
        fields = ['id', 'name', 'color', 'icon', 'sort_order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for ProductCategory model
    """
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = [
            'id',
            'name',
            'icon',
            'category_type',
            'sort_order',
            'show_in_carousel',
            'carousel_order',
            'is_active',
            'product_count',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_product_count(self, obj):
        """Get count of active products in this category"""
        return obj.products.filter(is_active=True).count()


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Product model
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url_full = serializers.SerializerMethodField()
    sku = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'category',
            'category_name',
            'name',
            'description',
            'image',
            'image_url',
            'image_url_full',
            'sku',
            'unit_label',
            'is_active',
            'rating',
            'rating_count',
            'tags',
            'benefits',
            'is_featured',
            'featured_title',
            'featured_description',
            'product_sort_order',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'image_url_full', 'category_name']

    def get_image_url_full(self, obj):
        """Get the full image URL (uploaded or external)"""
        request = self.context.get('request')
        image_url = obj.get_image_url()
        if image_url and request and not image_url.startswith('http'):
            return request.build_absolute_uri(image_url)
        return image_url

    def validate(self, data):
        """Convert empty strings to None for optional fields"""
        if 'sku' in data and data['sku'] == '':
            data['sku'] = None
        if 'image_url' in data and data['image_url'] == '':
            data['image_url'] = ''
        return data


class PublicProductCategorySerializer(serializers.ModelSerializer):
    """
    Public serializer for ProductCategory (only active)
    """
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'icon', 'category_type', 'sort_order', 'show_in_carousel', 'carousel_order', 'product_count']

    def get_product_count(self, obj):
        """Get count of active products in this category"""
        return obj.products.filter(is_active=True).count()


class PublicProductSerializer(serializers.ModelSerializer):
    """
    Public serializer for Product (only active)
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.category_type', read_only=True)
    image_url_full = serializers.SerializerMethodField()
    available = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    tags = ProductTagSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'category',
            'category_name',
            'category_type',
            'name',
            'description',
            'image_url',
            'image_url_full',
            'unit_label',
            'available',
            'is_available',
            'rating',
            'rating_count',
            'tags',
            'benefits',
            'is_featured',
            'featured_title',
            'featured_description',
            'product_sort_order'
        ]

    def get_image_url_full(self, obj):
        """Get the full image URL (uploaded or external)"""
        request = self.context.get('request')
        image_url = obj.get_image_url()
        if image_url and request and not image_url.startswith('http'):
            return request.build_absolute_uri(image_url)
        return image_url

    def get_available(self, obj):
        """Get available inventory quantity"""
        try:
            return obj.inventory_balance.available
        except Exception:
            # If no inventory record exists, assume unlimited stock
            return None

    def get_is_available(self, obj):
        """Check if product is available for ordering"""
        try:
            return obj.inventory_balance.available > 0
        except Exception:
            # If no inventory record exists, assume available
            return True
