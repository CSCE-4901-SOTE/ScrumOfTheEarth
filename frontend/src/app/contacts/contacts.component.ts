import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css'],
})
export class ContactsComponent {
  showModal = false;

  searchTerm = '';

  contacts = [
    {
      name: 'Apple Butter Farmhouse',
      phone: '(xxx)-xxx-xxx',
      email: 'abc123@farmra.com',
      nodes: 20,
    },
  ];

  newContact = {
    name: '',
    phone: '',
    email: '',
    nodes: 0,
  };

  openAddModal() {
    this.showModal = true;
  }

  closeAddModal() {
    this.showModal = false;
    this.newContact = { name: '', phone: '', email: '', nodes: 0 };
  }

  saveContact() {
    if (!this.newContact.name.trim()) {
      return;
    }

    this.contacts.push({ ...this.newContact });
    this.closeAddModal();
  }

  filteredContacts() {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.contacts;

    return this.contacts.filter((c) =>
      (c.name + c.phone + c.email + c.nodes)
        .toString()
        .toLowerCase()
        .includes(term)
    );
  }
}
