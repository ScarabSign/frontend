# Scarab Sign Frontend

This repository contains the frontend application for Scarab Sign, a next-generation NFT marketplace built on Starknet. Our frontend provides an intuitive interface for users to participate in gasless NFT auctions using multiplayer metatransactions.

## Features

Our frontend application enables users to:
- Connect their Braavos wallet seamlessly
- Create and broadcast NFT auctions
- Participate in active auctions with gasless bidding
- Monitor auction status in real-time
- View transaction history and auction results

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v16 or higher)
- Yarn package manager
- Docker and Docker Compose (for containerized deployment)
- A Braavos wallet browser extension

## Quick Start

Get the application running locally with these commands:

```bash
# Clone the repository
git clone https://github.com/scarab-sign/frontend.git
cd frontend

# Install dependencies
yarn install

# Start the development server
yarn dev
```

For containerized deployment:

```bash
# Build and start containers
docker-compose up --build

# Run in background
docker-compose up -d
```

## Environment Setup

Create a `.env` file in the project root:

```env
VITE_WEBSOCKET_URL=ws://localhost:3000
VITE_STARKNET_NETWORK=goerli
VITE_CONTRACT_ADDRESS=0x...
```

## Development

Our frontend uses the following tech stack:
- Vite + React for fast development
- starknet-react for blockchain integration
- Braavos wallet integration
- Websocket client for real-time auctions

Start developing with:

```bash
# Run development server
yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

## Testing

We use Vitest for unit testing. Run tests with:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Generate coverage report
yarn coverage
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # API and blockchain services
├── utils/         # Helper functions
└── App.tsx        # Root component
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Read our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Common Issues

- **Wallet Connection**: Ensure Braavos wallet extension is installed and on the correct network
- **WebSocket Errors**: Check if the WebSocket server is running and the URL is correct
- **Build Errors**: Make sure all environment variables are properly set

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Contact

For issues and feature requests, please use our [GitHub Issues](https://github.com/scarab-sign/frontend/issues).

---

Made with ❤️ by the Scarab Sign Team
