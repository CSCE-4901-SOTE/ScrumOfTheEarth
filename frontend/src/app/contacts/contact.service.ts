import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  nodes: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private baseUrl = 'http://localhost:8080/api/contacts';

  constructor(private http: HttpClient) {}

  getContacts(ownerId: string): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.baseUrl}/technician/${ownerId}`);
  }

  getFarmerContacts(userId: string): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.baseUrl}/farmer/${userId}`);
  }

  addContact(ownerId: string, email: string): Observable<Contact> {
    return this.http.post<Contact>(this.baseUrl, { ownerId, email });
  }

  deleteContact(ownerId: string, contactId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/${ownerId}/${contactId}`
    );
  }
}
