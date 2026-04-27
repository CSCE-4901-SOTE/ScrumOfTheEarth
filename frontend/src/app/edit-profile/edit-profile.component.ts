import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
})
export class EditProfileComponent implements OnInit {
  platformId = inject(PLATFORM_ID);

  backendUrl = environment.backendUrl;

  fullName = '';
  role = '';
  phone = '';
  userId = '';
  email = '';

  saveMessage = '';
  saveError = '';

  //profile image
  profileImageUrl: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.role = sessionStorage.getItem('role') ?? '';
      this.fullName = sessionStorage.getItem('fullName') ?? '';
      this.userId = sessionStorage.getItem('userId') ?? '';
      this.phone = sessionStorage.getItem('phone') ?? '';
      
      if (this.userId) {
        this.http.get<any>(`${this.backendUrl}/users/${this.userId}`).subscribe({
          next: (data) => {
            this.fullName = data.fullName ?? data.name ?? '';
              this.email = data.email ?? '';
              this.phone = data.phone ?? '';
              this.profileImageUrl = data.profileImage ?? null;

              sessionStorage.setItem('fullName', this.fullName);
              sessionStorage.setItem('phone', this.phone);
              sessionStorage.setItem('profileImage', data.profileImage ?? '');
          },
          error: (err) => {
              console.error('Failed to load profile:', err);
          }
        });
      }
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

    const payload = {
      phone: this.phone,
      fullName: this.fullName,
      profileImage: this.profileImageUrl
    };
    
    this.http.put<any>(`${this.backendUrl}/users/${this.userId}`, payload).subscribe({
      next: () => {
        this.saveMessage = 'Profile saved successfully.';
        sessionStorage.setItem('fullName', this.fullName);
        sessionStorage.setItem('phone', this.phone);
        sessionStorage.setItem('profileImage', this.profileImageUrl ?? '');
      },
      error: () => this.saveError = 'Failed to save. Please try again.'
    });
  }
}
