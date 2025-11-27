Feature: User registers to an available event

  As an authenticated user
  I want to register to an available event
  So that I can attend it

  Scenario: Register to an upcoming event from the feed
    Given I am authenticated
    And there is an available event named "User Registration E2E"
    When I open the event "User Registration E2E" from the feed
    And I register for the event
    Then I should see the registration confirmation
