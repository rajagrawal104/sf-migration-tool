({
    loadContacts: function(component) {
        component.set("v.isLoading", true);
        
        var action = component.get("c.getContacts");
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set("v.contacts", response.getReturnValue());
            } else {
                this.handleError(component, response);
            }
            component.set("v.isLoading", false);
        });
        
        $A.enqueueAction(action);
    },
    
    searchContacts: function(component, searchTerm) {
        component.set("v.isLoading", true);
        
        var action = component.get("c.searchContacts");
        action.setParams({
            searchTerm: searchTerm
        });
        
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set("v.contacts", response.getReturnValue());
            } else {
                this.handleError(component, response);
            }
            component.set("v.isLoading", false);
        });
        
        $A.enqueueAction(action);
    },
    
    navigateToRecord: function(recordId) {
        var navEvt = $A.get("e.force:navigateToSObject");
        navEvt.setParams({
            "recordId": recordId,
            "slideDevName": "detail"
        });
        navEvt.fire();
    },
    
    handleError: function(component, response) {
        var errors = response.getError();
        var message = "Unknown error";
        
        if (errors && Array.isArray(errors) && errors.length > 0) {
            message = errors[0].message;
        }
        
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            "title": "Error",
            "message": message,
            "type": "error"
        });
        toastEvent.fire();
    }
}) 