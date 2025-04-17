import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface MlPredictionRequest {
  inputFeatures: {
    ip: string;
    port?: number;
    protocol?: string;
  };
}

export interface MlPredictionResponse {
  prediction: string;
  confidenceScore: number;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MlPredictorService {

  private apiUrl = '/api/ml/predict';
  getLayoutSuggestions: any;

  constructor(private http: HttpClient) {}

  predict(data: MlPredictionRequest): Observable<MlPredictionResponse> {
    return this.http.post<MlPredictionResponse>(this.apiUrl, data)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Erreur ML Predictor:', error);
    return throwError(() => new Error('Une erreur est survenue lors de la prédiction ML.'));
  }
}
