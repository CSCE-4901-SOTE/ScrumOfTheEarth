import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
})
export class EditProfileComponent {
  fullName = '';
  dob = '';
  farm = '';
  phone = '';
  userId = '';

  //profile image
  profileImageUrl: string | null = null;

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
  //will add a save function later to save the profile changes to the backend
}
