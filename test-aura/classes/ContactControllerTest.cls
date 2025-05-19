@isTest
private class ContactControllerTest {
    @TestSetup
    static void setupTestData() {
        List<Contact> contacts = new List<Contact>();
        for(Integer i = 0; i < 10; i++) {
            contacts.add(new Contact(
                FirstName = 'Test' + i,
                LastName = 'Contact' + i,
                Email = 'test' + i + '@example.com'
            ));
        }
        insert contacts;
    }
    
    @isTest
    static void testGetContacts() {
        Test.startTest();
        List<Contact> contacts = ContactController.getContacts();
        Test.stopTest();
        
        System.assertEquals(10, contacts.size(), 'Should return 10 contacts');
    }
    
    @isTest
    static void testSearchContacts() {
        Test.startTest();
        List<Contact> contacts = ContactController.searchContacts('Test0');
        Test.stopTest();
        
        System.assertEquals(1, contacts.size(), 'Should return 1 contact');
        System.assertEquals('Test0 Contact0', contacts[0].Name, 'Should return the correct contact');
    }
} 