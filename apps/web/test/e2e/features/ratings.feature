Feature: Event Ratings

  As a subscribed user
  I want to rate events I attended
  So that I can provide feedback to event organizers

  Background:
    Given I am authenticated

  Scenario: Create a rating with a comment
    Given I have an ended event I am subscribed to
    When I navigate to the event page
    And I click the "Rate this event" button
    And I select 5 stars
    And I enter "Great event! Very well organized." in the comment field
    And I click the "Submit review" button
    Then the page should reload
    And I should see the "You already rated this event" button disabled
