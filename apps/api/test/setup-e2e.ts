// Mock BullMQ to prevent Redis connection attempts in e2e tests
jest.mock("@nestjs/bullmq", () => {
	const actual = jest.requireActual("@nestjs/bullmq");
	return {
		...actual,
		// biome-ignore lint/style/useNamingConvention: external library name
		BullModule: {
			forRootAsync: jest.fn().mockReturnValue({
				module: class MockBullRootModule {},
				providers: [],
				exports: [],
			}),
			registerQueue: jest.fn().mockReturnValue({
				module: class MockBullQueueModule {},
				providers: [
					{
						provide: "BullQueue_notifications",
						useValue: {
							add: jest.fn().mockResolvedValue({}),
							process: jest.fn(),
							on: jest.fn(),
						},
					},
				],
				exports: ["BullQueue_notifications"],
			}),
		},
	};
});
