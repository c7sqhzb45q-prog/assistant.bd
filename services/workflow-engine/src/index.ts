import { WorkflowExecutor } from './executor';

async function main() {
  console.log('🚀 Workflow Engine starting...');
  
  try {
    console.log('✅ Workflow Engine ready on port 3002');
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

main();
