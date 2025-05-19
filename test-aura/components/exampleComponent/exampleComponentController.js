({
    doInit: function(component, event, helper) {
        helper.loadContacts(component);
    },
    
    handleSearchTermChange: function(component, event, helper) {
        var searchTerm = event.getParam("value");
        component.set("v.searchTerm", searchTerm);
        helper.searchContacts(component, searchTerm);
    },
    
    handleSearch: function(component, event, helper) {
        var searchTerm = event.getParam("searchTerm");
        component.set("v.searchTerm", searchTerm);
        helper.searchContacts(component, searchTerm);
    },
    
    handleViewDetails: function(component, event, helper) {
        var contactId = event.getSource().get("v.data-id");
        helper.navigateToRecord(contactId);
    }
}) 