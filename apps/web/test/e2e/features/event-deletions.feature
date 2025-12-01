Feature: Event Deletion

  As an event creator
  I want to delete an existing event
  So that it is no longer visible in my events list

  Scenario: Delete an existing event successfully
    Given I am authenticated as an event creator
    And I create a new event named "Delete E2E Event"
    And I navigate to the manage events page
    When I click the delete event button for "Delete E2E Event"
    And I confirm the event deletion
    Then I should not see the event "Delete E2E Event" in the events list
