Feature: Event Creation

  As an authenticated event creator
  I want to create a new event
  So that students can discover and register for it

  Scenario: Create a new event successfully
    Given I am authenticated as an event creator
    And I am on the feed page
    When I navigate to the manage events page
    And I click the create event button
    And I fill in the event name with "Test E2E Event"
    And I fill in the event description with "This is a test event created via e2e testing"
    And I select the start date and time
    And I select the end date and time
    And I select a location
    And I upload an event image
    And I set the event quota to "50"
    And I click the save button
    Then I should be redirected to the manage events page
    And I should see my created event in the events list