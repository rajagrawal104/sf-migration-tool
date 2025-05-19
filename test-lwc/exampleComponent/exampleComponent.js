import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getContacts from '@salesforce/apex/ContactController.getContacts';
import searchContacts from '@salesforce/apex/ContactController.searchContacts';

export default class ExampleComponent extends NavigationMixin(LightningElement) {
    @track searchTerm = '';
    @track contacts = [];
    @track isLoading = false;

    get hasContacts() {
        return this.contacts && this.contacts.length > 0;
    }

    connectedCallback() {
        this.loadContacts();
    }

    loadContacts() {
        this.isLoading = true;
        getContacts()
            .then(result => {
                this.contacts = result;
            })
            .catch(error => {
                this.handleError(error);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleSearchTermChange(event) {
        this.searchTerm = event.target.value;
        this.searchContacts();
    }

    searchContacts() {
        if (!this.searchTerm) {
            this.loadContacts();
            return;
        }

        this.isLoading = true;
        searchContacts({ searchTerm: this.searchTerm })
            .then(result => {
                this.contacts = result;
            })
            .catch(error => {
                this.handleError(error);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleViewDetails(event) {
        const contactId = event.target.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: contactId,
                objectApiName: 'Contact',
                actionName: 'view'
            }
        });
    }

    handleError(error) {
        const message = error.body?.message || 'Unknown error';
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
        );
    }
} 