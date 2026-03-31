import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AlertItem } from '../models/alert.model';
import { backendUrl } from '../../environment';

@Injectable({ providedIn: 'root' })
export class AlertService {
    private readonly baseUrl = backendUrl + '/alerts';

    private _unreadCount = new BehaviorSubject<number>(0);
    unreadCount$ = this._unreadCount.asObservable();

    constructor(private http: HttpClient) {}

    getAlerts(): Observable<AlertItem[]> {
        return this.http.get<AlertItem[]>(this.baseUrl).pipe(
            tap(alerts => this._unreadCount.next(alerts.filter(a => !a.acknowledged).length))
        );
    }

    acknowledge(id: string): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}/acknowledge`, {}).pipe(
            tap(() => {
                const current = this._unreadCount.getValue();
                if (current > 0) this._unreadCount.next(current - 1);
            })
        );
    }
}
