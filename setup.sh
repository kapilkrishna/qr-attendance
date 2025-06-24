#!/bin/bash

echo "🎾 Tennis Academy MVP Setup"
echo "=========================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Python and Node.js are installed"

# Backend setup
echo ""
echo "🔧 Setting up Backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

# Seed the database
echo "Seeding database with sample data..."
python seed_data.py

echo "✅ Backend setup complete!"

# Frontend setup
echo ""
echo "🔧 Setting up Frontend..."
cd ..

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

echo "✅ Frontend setup complete!"

echo ""
echo "🚀 Setup Complete!"
echo "=================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend server:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python run.py"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   npm run dev"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Default coach password: tennis123"
echo ""
echo "Happy coding! 🎾" 