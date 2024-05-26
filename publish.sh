pnpm run build
if [ $? -eq 0 ]; then
    cd dist
    npm publish
    cd ..
fi
