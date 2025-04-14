# Project Documentation

## Overview
This project is a full-stack application consisting of a frontend, backend, and a MongoDB database. It is designed to be deployed on a Kubernetes cluster and utilizes GitLab CI/CD for continuous integration and deployment.

## Project Structure
```
docker-frontend-backend-db
├── .gitlab-ci.yml        # GitLab CI/CD configuration file
├── deployment.yaml       # Kubernetes deployment configuration
├── README.md             # Project documentation
```

## Setup Instructions

### Prerequisites
- Kubernetes cluster
- kubectl command-line tool
- GitLab account for CI/CD

### Deployment Steps

1. **Clone the Repository**
   Clone the repository to your local machine:
   ```
   git clone <repository-url>
   cd docker-frontend-backend-db
   ```

2. **Configure Kubernetes**
   Ensure your Kubernetes context is set to the desired cluster:
   ```
   kubectl config use-context <your-cluster-context>
   ```

3. **Deploy the Application**
   Apply the Kubernetes deployment configuration:
   ```
   kubectl apply -f deployment.yaml
   ```

4. **Verify the Deployment**
   Check the status of the deployments:
   ```
   kubectl get deployments -n app-namespace
   kubectl get pods -n app-namespace
   ```

## Usage
- Access the frontend application via the exposed service.
- The backend service communicates with the MongoDB database using the specified connection string.

## CI/CD Pipeline
The `.gitlab-ci.yml` file contains the configuration for the CI/CD pipeline, automating the build and deployment process. Ensure that your GitLab runner is properly configured to execute the pipeline.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.