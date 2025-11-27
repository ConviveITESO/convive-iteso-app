Feature: Event creator registers attendees

  As an event creator
  I want to register a user to my event
  So that the attendee can join the event

  Scenario: Register a newly created event attendee
    Given I am authenticated as an event creator
    And I create a new event named "Creator Registration E2E"
    When I open the event "Creator Registration E2E" from manage events
    And I register a user for the event
    Then I should see the registration confirmation
