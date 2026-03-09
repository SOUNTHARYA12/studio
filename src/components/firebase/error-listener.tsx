'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Enhanced logging for better debugging
      console.error('Firestore Permission Error Context:', {
        operation: error.context.operation,
        path: error.context.path,
        data: error.context.requestResourceData,
      });
      
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: `Permission denied for ${error.context.operation} on ${error.context.path}. Please check database rules.`,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
