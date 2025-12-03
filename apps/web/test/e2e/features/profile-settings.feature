Feature: Profile Settings

  As an authenticated user
  I want to edit my profile information
  So that I can keep my account information up to date

  Scenario: Edit username successfully
    Given I am authenticated
    And I am on the feed page
    When I navigate to the profile settings page
    When I click the "Edit Username" button
    And I change my username to "NewTestUser123"
    And I click the "Save Changes" button
    Then I should see the username saved successfully
    And the username field should display "NewTestUser123"

  Scenario: Cancel username edit
    Given I am authenticated
    And I am on the feed page
    When I navigate to the profile settings page
    When I click the "Edit Username" button
    And I change my username to "CanceledUsername"
    And I click the "Cancel" button
    Then the username should revert to the original value
    And the edit mode should be disabled

  Scenario: Upload profile picture
    Given I am authenticated
    And I am on the feed page
    When I navigate to the profile settings page
    When I upload a new profile picture
    Then the profile picture should be updated successfully
    And I should see the new profile image displayed
