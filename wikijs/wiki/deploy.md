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

### Запуск
```bash
cd /opt/wikijs
sudo docker compose up -d
```