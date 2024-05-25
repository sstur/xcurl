pnpm run build
if [ $? -eq 0 ]; then
    cd build
    npm publish
    cd ..
fi
