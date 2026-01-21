import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SurveyState {
  showProductRatings: boolean;
  showStaffRating: boolean;
  showStayRating: boolean;
  patientAssignmentId: number | null;
  staffName: string;
  productRatings: { [orderId: string]: { [productId: string]: number } } | null;
  staffRating: number | null;
}

interface SurveyContextType {
  surveyState: SurveyState;
  startSurvey: (patientAssignmentId: number, staffName: string) => void;
  setProductRatings: (ratings: { [orderId: string]: { [productId: string]: number } }) => void;
  setStaffRating: (rating: number) => void;
  completeSurvey: (stayRating: number, comment?: string) => Promise<void>;
  closeSurvey: () => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export const SurveyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [surveyState, setSurveyState] = useState<SurveyState>({
    showProductRatings: false,
    showStaffRating: false,
    showStayRating: false,
    patientAssignmentId: null,
    staffName: '',
    productRatings: null,
    staffRating: null,
  });

  const startSurvey = useCallback((patientAssignmentId: number, staffName: string) => {
    setSurveyState({
      showProductRatings: true,
      showStaffRating: false,
      showStayRating: false,
      patientAssignmentId,
      staffName,
      productRatings: null,
      staffRating: null,
    });
  }, []);

  const setProductRatings = useCallback((ratings: { [orderId: string]: { [productId: string]: number } }) => {
    setSurveyState((prev) => ({
      ...prev,
      productRatings: ratings,
      showProductRatings: false,
      showStaffRating: true,
    }));
  }, []);

  const setStaffRating = useCallback((rating: number) => {
    setSurveyState((prev) => ({
      ...prev,
      staffRating: rating,
      showStaffRating: false,
      showStayRating: true,
    }));
  }, []);

  const completeSurvey = useCallback(async (stayRating: number, comment?: string) => {
    const { patientAssignmentId, productRatings, staffRating } = surveyState;
    
    if (!patientAssignmentId || !productRatings || !staffRating) {
      throw new Error('Missing survey data');
    }

    const { ordersApi } = await import('../api/orders');
    
    try {
      await ordersApi.submitCompleteFeedback({
        patient_assignment_id: patientAssignmentId,
        product_ratings: productRatings,
        staff_rating: staffRating,
        stay_rating: stayRating,
        comment: comment || undefined,
      });
      
      // Close survey after successful submission
      setSurveyState({
        showProductRatings: false,
        showStaffRating: false,
        showStayRating: false,
        patientAssignmentId: null,
        staffName: '',
        productRatings: null,
        staffRating: null,
      });
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error.response?.data?.error || 'Error al enviar la encuesta. Por favor intenta de nuevo.';
      
      // If feedback was already submitted, close survey
      if (error.response?.status === 400 && errorMessage.includes('already submitted')) {
        setSurveyState({
          showProductRatings: false,
          showStaffRating: false,
          showStayRating: false,
          patientAssignmentId: null,
          staffName: '',
          productRatings: null,
          staffRating: null,
        });
        return;
      }
      
      throw error;
    }
  }, [surveyState]);

  const closeSurvey = useCallback(() => {
    setSurveyState({
      showProductRatings: false,
      showStaffRating: false,
      showStayRating: false,
      patientAssignmentId: null,
      staffName: '',
      productRatings: null,
      staffRating: null,
    });
  }, []);

  return (
    <SurveyContext.Provider
      value={{
        surveyState,
        startSurvey,
        setProductRatings,
        setStaffRating,
        completeSurvey,
        closeSurvey,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error('useSurvey must be used within SurveyProvider');
  }
  return context;
};
