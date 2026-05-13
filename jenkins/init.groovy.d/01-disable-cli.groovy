import jenkins.model.Jenkins
import jenkins.CLI

// Disable remoting-based CLI (security hardening; HTTPS CLI still available)
Jenkins.instance.getDescriptor("jenkins.CLI")?.with {
  it.enabled = false
  it.save()
}
