Feature: Event Subscription and Chat

  As an authenticated user
  I want to subscribe to an event and send a message in the group chat
  So that I can interact with other participants

  Scenario: Subscribe to upcoming event and send a chat message
    Given I am an authenticated user
    And I am on the feed page
    When I click on the first upcoming event
    And I click the subscribe button
    And I click the go to group chat button
    And I type "Hello everyone!" into the chat input
    And I send the message by pressing Enter
    Then I should see "Hello everyone!" in the chat thread
