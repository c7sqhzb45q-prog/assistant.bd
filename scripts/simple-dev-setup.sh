#!/bin/bash

# Simple dev setup for assistant.bd (without Docker)

set -e

echo "🚀 Setting up assistant.bd for local development"
echo ""

# Step 1: Create .env file
echo "📝 Creating .env file..."
cat > .env << 'ENVFILE'
# ============ DATABASE (you'll need to set this up)============
DATABASE_URL=postgresql://admin:secure_password@localhost:5432/assistant_bd

# ============ REDIS ============
REDIS_URL=redis://localhost:6379

# ============ JWT & AUTH ============
JWT_SECRET=your-super-secret-jwt-key-change-in-production-!@#$%
JWT_EXPIRES_IN=7d

# ============ AI/LLM SERVICES ============
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here

# ============ APPLICATION ============
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001
LOG_LEVEL=debug
ENVFILE

echo "✅ Created .env file"
echo ""

# Step 2: Show what's ready
echo "📚 What's Ready to Use:"
echo "   ✅ API Gateway (src ready)"
echo "   ✅ Workflow Engine (core logic ready)"
echo "   ✅ TypeScript Types (shared types ready)"
echo "   ✅ Documentation (complete)"
echo ""

# Step 3: Instructions
echo "🎯 Next Steps:"
echo ""
echo "1️⃣  Update .env with your API keys"
echo "   nano .env"
echo ""
echo "2️⃣  Start services (in separate terminals):"
echo ""
echo "   Terminal 1 - API Gateway:"
echo "   npm --prefix services/api-gateway run dev"
echo ""
echo "   Terminal 2 - Workflow Engine:"
echo "   npm --prefix services/workflow-engine run dev"
echo ""
echo "   Terminal 3 - Web Dashboard:"
echo "   npm --prefix apps/web run dev"
echo ""
echo "3️⃣  Open browser:"
echo "   http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   • INDEX.md - Navigation"
echo "   • docs/ARCHITECTURE.md - System design"
echo "   • docs/QUICKSTART.md - Full guide"
echo ""
echo "✅ Setup complete!"
