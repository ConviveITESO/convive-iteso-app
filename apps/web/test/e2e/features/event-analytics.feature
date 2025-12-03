Feature: Event Analytics - View Assistants

  As an event organizer
  I want to view the assistants of an event in analytics
  So that I can see who attended my event

  Scenario: View event assistants in analytics
    Given I am authenticated as an event creator
    And I am on the feed page
    When I navigate to the manage event page
    When I click the eye icon for the event "User Registration E2E"
    Then I should be redirected to the event analytics page
    When I click the Assistants tab
    Then I should see the assistants list with quota and attendee

  Scenario: Search assistants results
    Given I am authenticated as an event creator
    And I am on the feed page
    When I navigate to the manage event page
    When I click the eye icon for the event "User Registration E2E"
    Then I should be redirected to the event analytics page
    When I click the Assistants tab
    When I search assistants for "a"
    Then I should see at least one assistant in the list

  Scenario: Search assistants no results
    Given I am authenticated as an event creator
    And I am on the feed page
    When I navigate to the manage event page
    When I click the eye icon for the event "User Registration E2E"
    Then I should be redirected to the event analytics page
    When I click the Assistants tab
    When I search assistants for "zzzz-not-found-123"
    Then I should see no assistants in the list
