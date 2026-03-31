import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { backendUrl } from '../../environment';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
})
export class EditProfileComponent implements OnInit {
  fullName = '';
  dob = '';
  farm = '';
  phone = '';
  userId = '';
  email = '';

  saveMessage = '';
  saveError = '';

  //profile image
  profileImageUrl: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    if (this.userId) {
      this.http.get<any>(`${backendUrl}/users/${this.userId}`).subscribe({
        next: (data) => {
          this.fullName = data.name ?? '';
          this.email = data.email ?? '';
          this.phone = data.phone ?? '';
        },
        error: () => {}
      });
    }
  }

  onPickImage(fileInput: HTMLInputElement) {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.profileImageUrl = String(reader.result);
    };
    reader.readAsDataURL(file);

    fileInput.value = '';
  }

  onSave(): void {
    if (!this.userId) return;
    this.saveMessage = '';
    this.saveError = '';

    this.http.put<any>(`${backendUrl}/users/${this.userId}`, { phone: this.phone, name: this.fullName }).subscribe({
      next: () => this.saveMessage = 'Profile saved successfully.',
      error: () => this.saveError = 'Failed to save. Please try again.'
    });
  }
}
