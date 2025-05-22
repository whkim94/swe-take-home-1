FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package.json package-lock.json* ./
RUN npm install

# 소스 코드 복사
COPY . .

# 개발 서버를 위한 포트 노출
EXPOSE 3000

# 명령어는 docker-compose.yml에서 정의하므로 여기서는 기본 실행만
CMD ["npm", "run", "dev"] 