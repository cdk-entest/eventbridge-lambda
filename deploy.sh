cdk bootstrap aws://874056087589/ap-southeast-1
cdk --app 'npx ts-node --prefer-ts-exts bin/eventbridge-demo.ts' synth
cdk --app 'npx ts-node --prefer-ts-exts bin/eventbridge-demo.ts' deploy --all 
