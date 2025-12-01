Feature: Event Unsubscription

  As an event attendee
  I want to unsubscribe from an event
  So that I am no longer registered for it

  Background:
    Given I am authenticated

  Scenario: Unsubscribe from an event successfully
    Given there is an available event named "Event1"
    And I am registered to the event "Event1"
    When I navigate to the my events page
    And I click the unsubscribe button for "Event1"
    And I confirm the event unsubscription
    Then I should not see the event "Event1" in my upcoming events
