# product/Dockerfile — serve game tĩnh bằng nginx (dự phòng khi không dùng Pages).
# Build: docker build -t infinia ./product  (chạy từ infinia-vn, context phải chứa standalone/)
# Chạy:  docker run -p 8080:80 infinia
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
