/**
 * This function initializes the page when its loaded. This means it sets the
 * language and the content.
 */
function loadPage() {
    // We will always set the language first.
    setLanguage( readPreference( "language" ) );
    // Display a list of currently available budgets and display every budget in detail.
    updateView();
}

/**
 * This function adds a new transaction, either unique or recurring.
 */
function addTransaction() {
    // Find out which language is selected to set the text elements of the dialog.
    var textElements = getTransactionDialogTextElements();
    // Set the content of the dialog. First, get all budgets to offer a selection between them.
    var currentBudgets = readMainStorage( "budgets" );
    // We will add all the content to this and then display it in the dialog.
    var options = "";
    // Display an option for every available budget, so the user can select any budget.
    for ( var i = 0; i < currentBudgets.length; i++ ) {
        options += "<option value=\"" + currentBudgets[i][0] + "\">" + currentBudgets[i][0] + "</option>";
    }
    // Set the complete content for the dialog.
    var text = textElements[0] + "<form class=\"w3-center\"><input id=\"earning\" onclick=\"changeTransactionDialog();\" type=\"radio\" name=\"type\">" + textElements[1] +
               "<input id=\"spending\" style=\"margin-left:15px;\" type=\"radio\" name=\"type\" checked>" + textElements[2] + "</form><hr>" +
               "<b>Name</b><br><input type=\"text\" id=\"nameInput\"><br><hr>" +
               "<b>" + textElements[3] + "</b><br><input style=\"width=50px;\" type=\"text\" id=\"sumInput\"><br><hr>" +
               "<b>" + textElements[4] + "</b><br>" +
               "<select id=\"selectInput\">" + options + "</select><hr><input type=\"checkbox\" id=\"checkboxInput\">" + textElements[5];
    // Now we are able to actually create a dialog.
    createDialog( getTransactionDialogTitle(), text, function() {
        // Save the inputs and then execute the right function to add a new entry.
        var name = $( "#nameInput" ).val().trim();
        var sum = $( "#sumInput" ).val().trim();
        // Replace all commas with dots to make sure that parseFloat() works as intended.
        sum.replace( ",", "." );
        // Make sure that the input is ok.
        var inputOk = true;
        // Make sure that the name is not empty and that it contains only alphanumeric characters.
        if ( name.length < 1 || !/^[a-z0-9]+$/i.test( name ) ) inputOk = false;
        // Make sure that the sum contains no letters and that it contains at least one number.
        if ( /[a-z]/i.test( sum ) || !/\d/.test( sum ) ) inputOk = false;
        // Some character is not a digit? Make sure that this is only a single dot.
        // Also, make sure that there are not more than two decimal places.
        if ( /\D/.test ( sum ) ) {
            // No dot or more than one dot found?
            // (Remember that we already found at least one non digit character, so there has to be a dot)
            if ( sum.indexOf( "." ) === -1 || sum.replace( ".", "" ).length + 1 < sum.length ) inputOk = false;
            // Any other non digit characters found?
            if ( /\D/.test( sum.replace( ".", "" ) ) ) inputOk = false;
            // More than two decimal digits in the sum?
            if ( inputOk ) {
                // Remember that the input was already checked, so there is exactly one dot.
                if ( sum.split( "." )[1].length > 2 ) {
                    inputOk = false;
                }
            }
            // Note: Inputs like .5 are okay since parseFloat( ".5" ) = 0.5
        }
        // Input ok? Then continue.
        if ( inputOk ) {
            // Get the selected budget.
            var budgetSelect = document.getElementById( "selectInput" );
            var budget = budgetSelect.options[budgetSelect.selectedIndex].text;
            // Find out which type (earning/spending) was selected and
            // execute the correct function.
            if ( document.getElementById( "earning" ).checked ) {
                addEarning( name, parseFloat( sum ), budget );
            }
            else if ( document.getElementById( "spending" ).checked ) {
                addSpending( name, parseFloat( sum ), budget );
            }
        }
        // Wrong input: Show error message.
        else {
            dialog.showErrorBox( "Error", "Invalid input." );
        }
        // Close the dialog and update the view.
        $( this ).dialog( "close" );
        updateView();
    });
}

/**
 * This function saves new spending entries in .json files.
 * @param {String} spending The name of the spending.
 * @param {double} sum The cost of the aquired thing.
 * @param {String} budget The budget from which the sum should be subtracted.
 */
function addSpending( spending, sum, budget ) {
    // Create a JSON object containing the data.
    var spendingObj = {"date": getCurrentDate(), "name": spending, "amount": sum, "budget": budget, "type": "spending"};
    // Now store the data in the corresponding .json file.
    storeData( spendingObj );
    // Update the reference in the mainStorage.
    var budgets = readMainStorage( "budgets" );
    var allTimeSpendings = readMainStorage( "allTimeSpendings" );
    // Search for the correct budget.
    for ( var i = 0; i < allTimeSpendings.length; i++ ) {
        // Found it? Then update the value.
        if ( allTimeSpendings[i][0] === budget ) {
            allTimeSpendings[i][1] += sum;
        }
        if ( budgets[i][0] === budget ) {
            budgets[i][1] -= sum;
        }
    }
    // Write back to storage.
    writeMainStorage( "budgets", budgets );
    writeMainStorage( "allTimeSpendings", allTimeSpendings );
    // Update the view: Display the new balance.
    updateView();
}

/**
 * This function saves new earnings entries in .json files.
 * @param {String} earning The name of the earning.
 * @param {double} sum The amount of the earning.
 * @param {String} budget The budget to which the sum should be added.
 */
function addEarning( earning, sum, budget ) {
    // Create a JSON object containing the data.
    var spendingObj = {"date": getCurrentDate(), "name": earning, "amount": sum, "budget": budget, "type": "earning"};
    // Now store the data in the corresponding .json file.
    storeData( spendingObj );
    // Update the reference in the mainStorage.
    var budgets = readMainStorage( "budgets" );
    var allTimeEarnings = readMainStorage( "allTimeEarnings" );
    // Search for the correct budget.
    for ( var i = 0; i < allTimeEarnings.length; i++ ) {
        // Found it? Then update the value.
        if ( allTimeEarnings[i][0] === budget ) {
            allTimeEarnings[i][1] += sum;
        }
        if ( budgets[i][0] === budget ) {
            budgets[i][1] += sum;
        }
    }
    // Write back to storage.
    writeMainStorage( "budgets", budgets );
    writeMainStorage( "allTimeEarnings", allTimeEarnings );
    // Update the view: Display the new balance.
    updateView();
}

/**
 * This function creates a new budget. It opens a dialog in which the user types
 * in a name for the new budget.
 */
function addBudget() {
    // Add an input field to the dialog
    createDialog( getAddBudgetDialogTitle(), getAddBudgetDialogText() + "<br><input type=\"text\" id=\"dialogInput\">", function() {
        // Get all currently available budgets.
        var currentBudgets = readMainStorage( "budgets" );
        // Save the new budget (the input from the user).
        var newBudget = $( "#dialogInput" ).val().trim();
        // This is for checking if the entered name already exists.
        var alreadyExists = false;
        // This loop is just for making sure the entered input is not existing yet.
        for ( var i = 0; i < currentBudgets.length; i++ ) {
            // Input exists? Set variable to true and stop.
            if ( currentBudgets[i][0] === newBudget ) {
                alreadyExists = true;
                break;
            }
        }
        // Only add a new budget if it does not already exist and its name is not empty.
        if ( !alreadyExists && newBudget !== "" ) {
            // The balance of the new budget starts at 0.
            currentBudgets.push( [newBudget, 0.0] );
            // Save a reference to the new budget in the mainStorage.json file.
            writeMainStorage( "budgets", currentBudgets );
            // Update all time earnings and spendings for the new budget (set it to zero).
            var allTimeEarnings = readMainStorage( "allTimeEarnings" );
            allTimeEarnings.push( [newBudget, 0] );
            writeMainStorage( "allTimeEarnings", allTimeEarnings );
            var allTimeSpendings = readMainStorage( "allTimeSpendings" );
            allTimeSpendings.push( [newBudget, 0] );
            writeMainStorage( "allTimeSpendings", allTimeSpendings );
            // Do the same for the alloction (set the allocation of the new budget to zero).
            var allocation = readMainStorage( "allocation" );
            allocation.push( [newBudget, 0] );
            writeMainStorage( "allocation", allocation );
            // Update the view: List the new budget.
            updateView();
        }
        // Close the dialog (since this function is only executed when the OK button is pressed)
        $( this ).dialog( "close" );
    });
}

/**
 * This function deletes a budget. Before deleting it, we will show a dialog to
 * ask if deleting the budget is really wanted.
 * @param {String} name The name of the budget we want to delete.
 */
function deleteBudget( name ) {
    createDialog( getDeleteBudgetDialogTitle(), getDeleteBudgetDialogText(), function() {
        // Get all currently available budgets.
        var currentBudgets = readMainStorage( "budgets" );
        // Delete the budget in all time earnings/spendings as well.
        var allTimeEarnings = readMainStorage( "allTimeEarnings" );
        var allTimeSpendings = readMainStorage( "allTimeSpendings" );
        // We add all budgets except the one we want to delete.
        var updatedBudgets = [], updatedAllTimeEarnings = [], updatedAllTimeSpendings = [];
        // Search for the correct budget to delete it.
        // (Note that all arrays have the same length)
        for ( var i = 0; i < currentBudgets.length; i++ ) {
            // Add all budgets except the one we want to delete.
            if ( currentBudgets[i][0] !== name ) {
                updatedBudgets.push( currentBudgets[i] );
            }
            // Do the same for allTimeEarnings and allTimeSpendings.
            if ( allTimeEarnings[i][0] !== name ) {
                updatedAllTimeEarnings.push( allTimeEarnings[i] );
            }
            if ( allTimeSpendings[i][0] !== name ) {
                updatedAllTimeSpendings.push( allTimeSpendings[i] );
            }
        }
        // Save the updated budgets in the mainStorage.json file.
        writeMainStorage( "budgets", updatedBudgets );
        // Again, we do this as well for allTimeEarnings and allTimeSpendings.
        writeMainStorage( "allTimeEarnings", updatedAllTimeEarnings );
        writeMainStorage( "allTimeSpendings", updatedAllTimeSpendings );
        // Update the view: Don't display the deleted budget anymore.
        updateView();
        // Close the dialog (since this function is only executed when the OK button is pressed)
        $( this ).dialog( "close" );
    });
}

/**
 * This function renames a budget.
 * @param {String} name The name of the budget we want to change.
 */
function renameBudget( name ) {
    // Add an input field.
    createDialog( getRenameBudgetDialogTitle(), getRenameBudgetDialogText() + "<br><input type=\"text\" id=\"dialogInput\">", function() {
        // Get all currently available budgets.
        var currentBudgets = readMainStorage( "budgets" );
        // Rename the budget in all time earnings/spendings as well.
        var allTimeEarnings = readMainStorage( "allTimeEarnings" );
        var allTimeSpendings = readMainStorage( "allTimeSpendings" );
        // We add all budgets to this (and the renamed one with its new name)
        var updatedBudgets = [], updatedAllTimeEarnings = [], updatedAllTimeSpendings = [];
        var newName = $( "#dialogInput" ).val().trim();
        // Iterate over them to find the one we want to rename.
        for ( var i = 0; i < currentBudgets.length; i++ ) {
            // Found it? Rename it.
            if ( currentBudgets[i][0] === name ) {
                updatedBudgets.push( [newName, currentBudgets[i][1]] );
            }
            // Not the budget we are looking for? Push the budget unmodified.
            else {
                updatedBudgets.push( currentBudgets[i] );
            }
            // Do the same for allTimeEarnings and allTimeSpendings.
            if ( allTimeEarnings[i][0] === name ) updatedAllTimeEarnings.push( [newName, allTimeEarnings[i][1]] );
            else updatedAllTimeEarnings.push( allTimeEarnings[i] );
            if ( allTimeSpendings[i][0] === name ) updatedAllTimeSpendings.push( [newName, allTimeSpendings[i][1]] );
            else updatedAllTimeSpendings.push( allTimeSpendings[i] );
        }
        // Save the updated budgets in the mainStorage.json file.
        writeMainStorage( "budgets", updatedBudgets );
        // Again, we do this as well for allTimeEarnings and allTimeSpendings.
        writeMainStorage( "allTimeEarnings", updatedAllTimeEarnings );
        writeMainStorage( "allTimeSpendings", updatedAllTimeSpendings );
        // Update the view: Display the new name.
        updateView();
        // Close the dialog (since this function is only executed when the OK button is pressed)
        $( this ).dialog( "close" );
    });
}

/**
 * This function opens the automated allocation dialog.
 */
function setAllocation() {
    // Get all the text elements of the dialog.
    var textElements = getSetAllocationDialogTextElements();
    // We want to display all budgets and their allocations.
    var currentBudgets = readMainStorage( "budgets" );
    var currentAllocation = readMainStorage( "allocation" );
    var currentBudgetsHTML = "";
    // Display currently selected value as selected.
    // Note: The allocation array has the same length as the budgets array.
    // Additionally, the indizes are corresponding, so we don't need further checking.
    // (Obviously, this is only true if nobody manipulated the .json file)
    for ( var i = 0; i < currentBudgets.length; i++ ) {
        // We need a precise id of every selection (every budget has its own selection with 10 options in it).
        var currentAllocationHTML = "";
        // We want to loop from 0 to 10, because the options should range from 0 to 100 percent, with an increase of 10 per step.
        for ( var j = 0; j <= 10; j++ ) {
            // We display the previously selected value as selected.
            if ( j * 10 === currentAllocation[i][1] ) {
                // Note that we have 10 options for every budget.
                currentAllocationHTML += "<option selected=\"selected\">" + currentAllocation[i][1] + "</option>";
            }
            // This is for every other value (not previously selected).
            else {
                currentAllocationHTML += "<option>" + (j * 10).toString() + "</option>";
            }
        }
        // This holds the lines of the table.
        currentBudgetsHTML += "<tr class=\"w3-hover-light-blue\">" +
                              "<td>" + currentBudgets[i][0] + "</td>" +
                              "<td><select class=\"w3-select\" id=\"percentageSelect" + i.toString() + "\">" + currentAllocationHTML + "</select></td></tr>";
    }
    // This holds the checkbox to activate/deactivate the allocation (and a tooltip).
    var activateCheckBox = "<br><br>" + "<input type=\"checkbox\" id=\"autoAllocation\"> " + textElements[1] + " " +
                           "<div class=\"tooltip\"><i class=\"fas fa-info-circle\"></i><span class=\"tooltiptext\">" + textElements[2] + "</span></div>";
    // Now combine the elements to set the complete content of the dialog.
    var text = textElements[0] + activateCheckBox +
               "<br><hr>" +
               "<table class=\"w3-table-all\">" +
               "<tr><th>" + textElements[3] + "</th>" +
               "<th>" + textElements[4] + "</th>" +
               currentBudgetsHTML + "</tr></table>";
    // Create a new dialog.
    createDialog( getSetAllocationDialogTitle(), text, function() {
        // Get the allocation array and iterate over it.
        var allocation = readMainStorage( "allocation" );
        // Since we want to write, we need a new object to which we push the new data.
        var newAllocation = [];
        // Set the selected value for every budget. In addition to that, we will calculate
        // the sum, to check if it is exactly 100%.
        var checkSum = 0;
        for ( var i = 0; i < allocation.length; i++ ) {
            var value = $( "#percentageSelect" + i + " " + "option:selected" ).text();
            newAllocation.push( [allocation[i][0], parseInt( value )] );
            checkSum += parseInt( value );
        }
        // Check, if input is O.K.
        if ( checkSum === 100 ) {
            // Now write the updated values in the storage.
            writeMainStorage( "allocation", newAllocation );
            // Get the value of the checkbox and save it in the main storage.
            setAllocationOn();
            // Close the dialog and update the view.
            $( this ).dialog( "close" );
            updateView();
        }
        // Input not O.K.? Show error message.
        else {
            dialog.showErrorBox( "Error", "The sum of the parts has to be 100%!" );
        }
    });
    // Display checkbox as selected if it was selected previously.
    if ( readMainStorage( "allocationOn" ) ) $( "#autoAllocation" )[0].checked = true;
}

/**
 * This function sets the value of "allocationOn".
 */
function setAllocationOn() {
    // Checkbox activated?
    if ( $( "#autoAllocation" )[0].checked ) {
        writeMainStorage( "allocationOn", true );
    }
    // Checkbox not activated?
    else {
        writeMainStorage( "allocationOn", false );
    }
}
