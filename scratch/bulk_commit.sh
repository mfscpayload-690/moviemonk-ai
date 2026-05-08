#!/bin/bash

# Array to store files to commit
files=()

# Process existing status
while IFS= read -r line; do
    status=$(echo "$line" | cut -c 1-2)
    file=$(echo "$line" | cut -c 4-)
    
    if [[ "$file" == "server/" ]]; then
        # Expand server directory
        while IFS= read -r f; do
            files+=("ADD:$f")
        done < <(find server -type f | grep -v "__pycache__" | grep -v "venv")
    elif [[ "$status" == " D" ]]; then
        files+=("DEL:$file")
    else
        files+=("ADD:$file")
    fi
done < <(git status --porcelain)

echo "Total commits planned: ${#files[@]}"

# Loop through files and commit
for item in "${files[@]}"; do
    type=$(echo "$item" | cut -d':' -f1)
    file=$(echo "$item" | cut -d':' -f2-)
    
    if [[ "$type" == "DEL" ]]; then
        git rm "$file"
        git commit -m "chore: remove legacy file $file"
    else
        git add "$file"
        git commit -m "feat: implement/update $file"
    fi
done

echo "Done! Total commits: $(git rev-list --count HEAD ^origin/feature/dedicated-backend)"
