## Script for sending all ERC20 tokens to a different address

```bash
cp .env.example .env
docker-compose build
nano .env # set environment variables, keep SKIP_DRY_RUN=false for now
docker-compose up
nano .env # set SKIP_DRY_RUN=true
docker-compose up
```
