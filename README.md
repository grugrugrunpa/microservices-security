# MICROSERVICES SECURITY
###### HOW TO SECURE APIs WITH RED HAT SINGLE SIGN-ON (KEYCLOAK), FUSE (CAMEL) AND 3SCALE.

![security](https://raw.githubusercontent.com/aelkz/microservices-security/master/_images/03.png "Microservices Security")

<p align="center">

| Technology       | Version             |
| --------------- | -------------------- |
| [spring boot](https://spring.io/projects/spring-boot)     | 2.1.8.RELEASE        |
| [apache camel](https://camel.apache.org/)    | [7.4.0.fuse-740036-redhat-00002](https://www.redhat.com/en/technologies/jboss-middleware/fuse)<br>(w/ spring boot 1.5.22.RELEASE) |
| [3Scale](https://www.3scale.net)    |  [2.6](https://access.redhat.com/containers/#/product/RedHat3scaleApiManagement) |
| [Red Hat Single Sign-On](https://access.redhat.com/products/red-hat-single-sign-on)    | [7.3.3](https://access.redhat.com/containers/#/product/RedHatSingleSign-on)<br>(based on [keycloak 4.8](https://access.redhat.com/articles/2342881)) |

</p>

<b>TL;DR</b> This is a demonstration on how to protect APIs managed by Keycloak and 3Scale.

<p align="center">
<img src="https://raw.githubusercontent.com/aelkz/microservices-security/master/_images/04.png" title="Microservices Security" width="40%" height="40%" />
</p>

<b>WARNING</b>: This is a proof of concept. In production environments, there will be needed adittional configurations regarding scalability and security.

<b>The use-case scenario:</b>
The main proposal is achieve some concepts regarding security and microservices using a simple use-case scenario. A webapp is offered to promote easier understanding showing all use-case scenarios:


All APIs catalog is exposed bellow:

### `auth-integration-api` endpoints

| Method | URI | Description | Secured? |
| ------ | --- | ----------- | -------- | 
| GET    |/actuator/health | API actuator embedded health | false |
| POST   |/api/v1/product  | Create new product | true |
| DELETE |/api/v1/product/{id}  | Delete product by Id | true |
| PUT   |/api/v1/product/{id}  | Update product by Id | true |
| GET   |/api/v1/product/{id}  | Retrieve product by Id | true |
| GET   |/api/v1/product  | Retrieve all products | true |
| GET   |/api/v1/product/status  | Check Product API health | true |
| GET   |/api/v1/supplier/status  | Check Supplier API health | true |
| GET   |/api/v1/stock/status  | Check Stock API health | true |
| GET   |/api/v1/supplier/sync  | Call the Supplier Maintenance API | true |
| GET   |/api/v1/stock/sync  | Call the Stock Maintenance API | true |

### `stock-api` endpoints

| Method | URI | Description | Secured? |
| ------ | --- | ----------- | -------- |
| GET    |/api/v1/sync | Stock Maintenance | false |

### `supplier-api` endpoints

| Method | URI | Description | Secured? |
| ------ | --- | ----------- | -------- |
| GET    |/api/v1/sync | Supplier Maintenance | true | 

### `product-api` endpoints

| Method | URI | Description | Secured? |
| ------ | --- | ----------- | -------- |
| GET    |/api/v1/products | Retrieve all products | true |
| GET    |/api/v1/product/{id} | Retrieve product by Id | true |
| POST   |/api/v1/product | Create new product | true |
| PUT    |/api/v1/product/{id} | Update product by Id | true |
| DELETE |/api/v1/product/{id} | Delete product by Id | true |

Each endpoint has it's own specifity, so in order to drive our test scenarios, I've ended up with 3 simple questions:

1. This API will be protected by an Integration Layer (FUSE)?
2. This API will be exposed as a unique service on 3Scale AMP?
3. This API will be managed by Keycloak having it's own client-id, groups and roles?

This lead me to draw this requirements matrix:

<p align="center">
<img src="https://raw.githubusercontent.com/aelkz/microservices-security/master/_images/05.png" title="APIs Requirements" width="100%" height="100%" />
</p>

As we can see, each API has some differences, and we will strive to demonstrate each one in this tutorial.

### `SECURITY LAB: STEP 1 - PROJECT CREATION`

```sh
export current_project=microservices

# login into openshift platform
oc login https://master.<>.com:443 --token=<>

# create a new project
oc new-project microservices --description="microservices security" --display-name="microservices"
```

### `SECURITY LAB: STEP 2 - SONATYPE NEXUS`
In order to continue this lab, you must provide a Sonatype Nexus instance in the `microservices` namespace. The detailed instructions can be found in this [readme](https://github.com/aelkz/microservices-security/blob/master/README-NEXUS.md).

### `SECURITY LAB: STEP 3 - 3SCALE SETUP`


### `SECURITY LAB: STEP 4 - RED HAT SINGLE SIGN-ON SETUP`


### `SECURITY LAB: STEP 5 - MICROSERVICES DEPLOYMENT`

```sh
export current_project=microservices

git clone https://github.com/aelkz/microservices-observability.git

cd microservices-observability/

# download maven settings.xml file
curl -o maven-settings-template.xml -s https://raw.githubusercontent.com/aelkz/microservices-observability/master/_configuration/nexus/maven-settings-template.xml

# change mirror url using your nexus openshift route
export MAVEN_URL=http://$(oc get route nexus3 --template='{{ .spec.host }}')/repository/maven-group/
export MAVEN_URL_RELEASES=http://$(oc get route nexus3 --template='{{ .spec.host }}')/repository/maven-releases/
export MAVEN_URL_SNAPSHOTS=http://$(oc get route nexus3 --template='{{ .spec.host }}')/repository/maven-snapshots/

awk -v path="$MAVEN_URL" '/<url>/{sub(/>.*</,">"path"<")}1' maven-settings-template.xml > maven-settings.xml

rm -fr maven-settings-template.xml

# deploy parent project on nexus
mvn clean package deploy -DnexusReleaseRepoUrl=$MAVEN_URL_RELEASES -DnexusSnapshotRepoUrl=$MAVEN_URL_SNAPSHOTS -s ./maven-settings.xml -e -X -N

# deploy polar-flow-api (spring boot 2 API)
# NOTE. In order to import Red Hat container images, you must setup your credentials on openshift. See: https://access.redhat.com/articles/3399531
# The config.json can be found at: /var/lib/origin/.docker/ on openshift master node.
# create a secret with your container credentials
oc delete secret redhat.io -n openshift
oc create secret generic "redhat.io" --from-file=.dockerconfigjson=config.json --type=kubernetes.io/dockerconfigjson -n openshift
oc create secret generic "redhat.io" --from-file=.dockerconfigjson=config.json --type=kubernetes.io/dockerconfigjson -n microservices

oc import-image openjdk/openjdk-8-rhel8 --from=registry.redhat.io/openjdk/openjdk-8-rhel8 --confirm -n openshift

# oc delete all -lapp=polar-flow-api
oc new-app openjdk-8-rhel8:latest~https://github.com/aelkz/microservices-observability.git --name=polar-flow-api --context-dir=/polar-flow-api --build-env='MAVEN_MIRROR_URL='${MAVEN_URL} -e MAVEN_MIRROR_URL=${MAVEN_URL}

oc patch svc polar-flow-api -p '{"spec":{"ports":[{"name":"http","port":8080,"protocol":"TCP","targetPort":8080}]}}'

oc label svc polar-flow-api monitor=springboot2-api
```

```sh
oc expose svc/polar-flow-api -n ${current_project}

# NOTE: if you need to change jaeger host and port, or any other settings, just create a new application.yaml file and mount as a new volume on polar-flow-api container.
vim src/main/resources/application.yaml

oc delete configmap polar-flow-api-config

oc create configmap polar-flow-api-config --from-file=src/main/resources/application.yaml

oc set volume dc/polar-flow-api --add --overwrite --name=polar-flow-api-config-volume -m /deployments/config -t configmap --configmap-name=polar-flow-api-config
```

### `OBSERVABILITY LAB: STEP 6 - SSO-COMMON LIBRARY DEPLOYMENT ON NEXUS`


### `OBSERVABILITY LAB: STEP 7 - INTEGRATION DEPLOYMENT (FUSE)`
Now that the main API is deployed, let’s deploy the integration layer.

```sh
# import a new spring-boot camel template
curl -o s2i-microservices-fuse73-spring-boot-camel.yaml -s https://raw.githubusercontent.com/aelkz/microservices-observability/master/_configuration/openshift/s2i-microservices-fuse73-spring-boot-camel.yaml

oc delete template s2i-microservices-fuse73-spring-boot-camel -n microservices

oc create -n microservices -f s2i-microservices-fuse73-spring-boot-camel.yaml

export current_project=microservices
export app_name=medical-integration
export app_group=com.redhat.microservices
export app_git=https://github.com/aelkz/microservices-observability.git
export app_git_branch=master
export maven_url=http://$(oc get route nexus3 --template='{{ .spec.host }}' -n ${current_project})/repository/maven-group/

oc delete all -lapp=${app_name}-api

# the custom template has some modifications regarding services,route and group definitions.
oc new-app --template=s2i-microservices-fuse73-spring-boot-camel --name=${app_name}-api --build-env='MAVEN_MIRROR_URL='${maven_url} -e MAVEN_MIRROR_URL=${maven_url} --param GIT_REPO=${app_git} --param APP_NAME=${app_name}-api --param ARTIFACT_DIR=${app_name}/target --param GIT_REF=${app_git_branch} --param MAVEN_ARGS_APPEND='-pl '${app_name}' --also-make'

# check the created services:
# 1 for default app-context and 1 for /metrics endpoint.
oc get svc -n microservices | grep medical

# in order to polar-flow-api call the medical-integration-api, we need to change it's configuration
curl -o application.yaml -s https://raw.githubusercontent.com/aelkz/microservices-observability/master/_configuration/openshift/polar-flow/application.yaml

# NOTE. If you have changed the service or application's name, you need to edit and change the downloaded application.yaml file with your definitions.

# create a configmap and mount a volume for polar-flow-api

oc delete configmap polar-flow-api-config

oc create configmap polar-flow-api-config --from-file=application.yaml

oc set volume dc/polar-flow-api --add --overwrite --name=polar-flow-api-config-volume -m /deployments/config -t configmap --configmap-name=polar-flow-api-config

rm -fr application.yaml

# now let's create a new service monitor under prometheus operator, to scrape medical-integration-api metrics

# repeat the initial steps of this tutorial on how to create a prometheus service monitor. Use the following definition to scrape FUSE based application metrics:
```

```sh
# now, we change the medical-integration-api svc to enable prometheus scraping.

# not needed actually
oc patch svc medical-integration-api-metrics -p '{"spec":{"ports":[{"name":"http","port":8081,"protocol":"TCP","targetPort":8081}]}}'

# NOTE: The metrics of FUSE applications will be exposed on port 8081 by default as defined on our custom template (s2i-microservices-fuse73-spring-boot-camel)

oc label svc medical-integration-api-metrics monitor=fuse73-api

# if you quick navigate to prometheus console, you'll see the FUSE target being loaded state=UNKNOWN and then becoming with state=UP:
```

```sh
# If you want to validate pod communication, go to polar-flow-api terminal and issue:

curl -X GET http://medical-integration-api-metrics.microservices.svc.cluster.local:8081/metrics

curl telnet://medical-integration-api-metrics.microservices.svc.cluster.local:8081
```

### `EXTERNAL REFERENCES`

API Key Generator
https://codepen.io/corenominal/pen/rxOmMJ<br>
JWT Key Generator
http://jwt.io

- - - - - - - - - -
Thanks for reading and taking the time to comment!<br>
Feel free to create a <b>PR</b><br>
[raphael abreu](rabreu@redhat.com)
