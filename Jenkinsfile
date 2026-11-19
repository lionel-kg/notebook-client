pipeline {
    agent any

    environment {
        // Nom de l'image et du conteneur
        IMAGE_NAME = "notebook_client"
        CONTAINER_NAME = "notebook-client"
        // On définit le port interne de ton API (ex: 4000)
        APP_PORT = "4100"
        // Adresse de l'API vers laquelle le front relaie /api/* (figée dans l'image au build)
        API_URL = "https://api-notebook.lionelkg.com"
    }

    stages {
        stage('Docker Build') {
            steps {
                echo 'Construction de l\'image Docker...'
                sh 'docker build --build-arg API_URL=${API_URL} -t ${IMAGE_NAME}:latest .'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Déploiement du conteneur...'
                script {
                    // 1. Arrêter et supprimer l'ancien conteneur s'il existe
                    sh "docker stop ${CONTAINER_NAME} || true"
                    sh "docker rm ${CONTAINER_NAME} || true"
                    
                    // 2. Lancer le nouveau conteneur
                    // On passe le fichier .env présent sur le VPS
                    sh """
                        docker run -d \
                        --name ${CONTAINER_NAME} \
                        --network notebook-network \
                        -p ${APP_PORT}:${APP_PORT} \
                        --restart unless-stopped \
                        ${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Nettoyage des images inutilisées...'
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo '✅ Déploiement réussi !'
        }
        failure {
            echo '❌ Le déploiement a échoué. Vérifie les logs.'
        }
    }
}
