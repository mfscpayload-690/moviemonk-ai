allprojects {
    repositories {
        mavenLocal()
        google()
        mavenCentral()
    }
    tasks.configureEach {
        if (name.contains("AarMetadata")) {
            enabled = false
        }
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

subprojects {
    tasks.matching { it.name.contains("CheckAarMetadata") }.configureEach {
        enabled = false
    }
}
