Feature: Event Comments

  As a user
  I want to view comments on events
  So that I can read feedback from other attendees

  Background:
    Given I am authenticated

  Scenario: View a comment on an event
    Given I have an ended event with a comment
    When I click the comments icon button
    Then the comments modal should open
    And I should see my comment displayed
