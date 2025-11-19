Feature: Homepage smoke

  As a visitor
  I want to load the homepage
  So that I can verify the site is reachable

  Scenario: Render homepage successfully
    Given I am on the home page
    When the page finishes loading
    Then I should see the main document body
    And the application root should be visible
    And I should see the title "Convive ITESO"
    And I should see the button "Sign in with ITESO"