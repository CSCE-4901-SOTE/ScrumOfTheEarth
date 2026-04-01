import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContactService, Contact } from './contact.service';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent implements OnInit {
  menuOpen = false;
  showModal = false;
  showDeleteModal = false;
  searchTerm = '';

  role: string | null = null;
  fullName: string | null = null;
  userId: string | null = null;

  contacts: Contact[] = [];
  selectedContactIds: string[] = [];

  newContact = {
    email: ''
  };

  errorMessage = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.role = sessionStorage.getItem('role');
      this.fullName = sessionStorage.getItem('fullName');
      this.userId = sessionStorage.getItem('userId');

      this.reloadContacts();
    }
  }

  get displayRole(): string {
    if (!this.role) return 'No Role';

    switch (this.role.toLowerCase()) {
      case 'farmer':
        return 'Farmer';
      case 'technician':
        return 'Technician';
      default:
        return this.role;
    }
  }

  get isTechnician(): boolean {
    return this.role?.toLowerCase() === 'technician';
  }

  get isFarmer(): boolean {
    return this.role?.toLowerCase() === 'farmer';
  }

  get nodeColumnTitle(): string {
    return this.isFarmer ? 'Total Installed Nodes' : 'Number of Nodes';
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  openAddModal(): void {
    this.errorMessage = '';
    this.showModal = true;
  }

  closeAddModal(): void {
    this.showModal = false;
    this.newContact = { email: '' };
    this.errorMessage = '';
  }

  openDeleteModal(): void {
    if (this.selectedContactIds.length === 0) {
      return;
    }
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  toggleContactSelection(contactId: string): void {
    const index = this.selectedContactIds.indexOf(contactId);

    if (index === -1) {
      this.selectedContactIds.push(contactId);
    } else {
      this.selectedContactIds.splice(index, 1);
    }
  }

  isContactSelected(contactId: string): boolean {
    return this.selectedContactIds.includes(contactId);
  }

  clearSelection(): void {
    this.selectedContactIds = [];
  }

  reloadContacts(): void {
    if (!this.userId) return;

    if (this.isTechnician) {
      this.loadTechnicianContacts();
    } else if (this.isFarmer) {
      this.loadFarmerContacts();
    }
  }

  loadTechnicianContacts(): void {
    if (!this.userId) return;

    this.contactService.getContacts(this.userId).subscribe({
      next: (data: Contact[]) => {
        this.contacts = data;
        this.clearSelection();
      },
      error: (err: any) => {
        console.error('Load technician contacts failed:', err);
      }
    });
  }

  loadFarmerContacts(): void {
    if (!this.userId) return;

    this.contactService.getFarmerContacts(this.userId).subscribe({
      next: (data: Contact[]) => {
        this.contacts = data;
        this.clearSelection();
      },
      error: (err: any) => {
        console.error('Load farmer contacts failed:', err);
      }
    });
  }

  saveContact(): void {
    if (!this.userId || !this.newContact.email.trim()) {
      this.errorMessage = 'Please enter an email.';
      return;
    }

    this.contactService.addContact(this.userId, this.newContact.email.trim()).subscribe({
      next: () => {
        this.reloadContacts();
        this.closeAddModal();
      },
      error: (err: any) => {
        console.error('Add contact failed:', err);

        if (typeof err?.error === 'string') {
          this.errorMessage = err.error;
        } else {
          this.errorMessage =
            err?.error?.message ||
            err?.message ||
            'Failed to add contact.';
        }
      }
    });
  }

  confirmDeleteSelectedContacts(): void {
    if (!this.userId || this.selectedContactIds.length === 0) return;

    const idsToDelete = [...this.selectedContactIds];
    let deletedCount = 0;

    idsToDelete.forEach((contactId) => {
      this.contactService.deleteContact(this.userId!, contactId).subscribe({
        next: () => {
          deletedCount++;

          if (deletedCount === idsToDelete.length) {
            this.closeDeleteModal();
            this.reloadContacts();
          }
        },
        error: (err: any) => {
          console.error('Delete contact failed:', err);
        }
      });
    });
  }

  deleteContact(contactId: string): void {
    if (!this.userId) return;

    this.contactService.deleteContact(this.userId, contactId).subscribe({
      next: () => {
        this.reloadContacts();
      },
      error: (err: any) => {
        console.error('Delete contact failed:', err);
      }
    });
  }

  filteredContacts(): Contact[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return this.contacts;

    return this.contacts.filter((c) =>
      `${c.name} ${c.phone} ${c.email} ${c.nodes}`
        .toLowerCase()
        .includes(term)
    );
  }
}
