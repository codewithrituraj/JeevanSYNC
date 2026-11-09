FROM python:3.12-slim

WORKDIR /app/server

COPY server/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY server ./

ENV FLASK_DEBUG=0
ENV PYTHONUNBUFFERED=1

EXPOSE 10000

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 app:app"]
