### Установка Access Control Lists
```bash
sudo apt update
sudo apt install acl
```

### Права на запись в папку /opt 
Для размещения в ней docker-compose.yaml и других файлов по необходимости
```bash
sudo setfacl -R -m u:abelchenko:rwx /opt
```

### Установка docker
https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository
https://docs.docker.com/compose/install/linux/#install-using-the-repository

### Подключение к PG из терминала для проверки
```bash
psql "host=rc1a-wn9ns0e2z746q217.mdb.yandexcloud.net \
    port=6432 \
    sslmode=verify-full \
    dbname=wiki \
    user=wikiadmin \
    sslrootcert=/opt/wikijs/root.crt \
    target_session_attrs=read-write"
```

```bash
psql "host=rc1a-wn9ns0e2z746q217.mdb.yandexcloud.net \
    port=6432 \
    sslmode=disable \
    dbname=wiki \
    user=wikiadmin \
    target_session_attrs=read-write"
```


### Преобразование текста сертификата для вставки в docker-compose.yaml

```bash
cd /opt/wikijs
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' root.crt
```
Подключение с SSL в итоге не удалось установить.
Настроил подключение без SSL. 

### Запуск
```bash
cd /opt/wikijs
sudo docker compose up -d
```


### Просмотр логов

```bash
sudo docker ps
```


```bash
docker logs -f wikijs-wiki-1
```

