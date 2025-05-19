public with sharing class ContactController {
    @AuraEnabled
    public static List<Contact> getContacts() {
        return [
            SELECT Id, Name, Email, Phone, Title
            FROM Contact
            ORDER BY Name
            LIMIT 50
        ];
    }
    
    @AuraEnabled
    public static List<Contact> searchContacts(String searchTerm) {
        String searchKey = '%' + searchTerm + '%';
        return [
            SELECT Id, Name, Email, Phone, Title
            FROM Contact
            WHERE Name LIKE :searchKey
            OR Email LIKE :searchKey
            ORDER BY Name
            LIMIT 50
        ];
    }
} 