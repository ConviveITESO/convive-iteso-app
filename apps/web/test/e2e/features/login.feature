Feature: Login
  As a user
  I want to log in to the application
  So that I can access the feed

  Scenario: Access feed as authenticated user
    Given I am authenticated
    When I navigate to the feed page
    Then I should see the feed page
