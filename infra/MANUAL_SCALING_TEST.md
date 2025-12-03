# Manual Scaling and Load Balancer Testing Guide

This guide demonstrates how to manually trigger autoscaling and verify that the Application Load Balancer (ALB) is properly distributing requests across multiple instances.

## Prerequisites

- AWS CLI configured with the `conviveiteso` profile
- Terraform infrastructure deployed
- Basic understanding of AWS Auto Scaling Groups and Load Balancers

## Table of Contents

1. [Manual Scaling Up](#manual-scaling-up)
2. [Verify Instance Health](#verify-instance-health)
3. [Test Load Balancer Distribution](#test-load-balancer-distribution)
4. [Monitor Request Distribution](#monitor-request-distribution)
5. [Manual Scaling Down](#manual-scaling-down)

---

## Manual Scaling Up

### Step 1: Check Current ASG Status

First, check the current state of both frontend and backend Auto Scaling Groups:

```bash
# Frontend ASG
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names convive-iteso-frontend-asg \
  --profile conviveiteso \
  --query 'AutoScalingGroups[0].{MinSize:MinSize,Desired:DesiredCapacity,MaxSize:MaxSize,CurrentInstances:length(Instances)}' \
  --output table

# Backend ASG
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names convive-iteso-backend-asg \
  --profile conviveiteso \
  --query 'AutoScalingGroups[0].{MinSize:MinSize,Desired:DesiredCapacity,MaxSize:MaxSize,CurrentInstances:length(Instances)}' \
  --output table
```

**Expected Output:**

```
-------------------------------------------------------
|              DescribeAutoScalingGroups              |
+-------------------+----------+----------+-----------+
| CurrentInstances  | Desired  | MaxSize  |  MinSize  |
+-------------------+----------+----------+-----------+
|  1                |  1       |  3       |  1        |
+-------------------+----------+----------+-----------+
```

### Step 2: Scale Up to 2 Instances

Manually increase the desired capacity to 2 instances:

```bash
# Scale frontend ASG
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name convive-iteso-frontend-asg \
  --desired-capacity 2 \
  --profile conviveiteso

# Scale backend ASG (optional, test one at a time)
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name convive-iteso-backend-asg \
  --desired-capacity 2 \
  --profile conviveiteso
```

**Expected Output:**

```
(No output means success)
```

### Step 3: Verify Scaling Activity

Check that the new instance is launching:

```bash
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names convive-iteso-frontend-asg \
  --profile conviveiteso \
  --query 'AutoScalingGroups[0].Instances[*].{InstanceId:InstanceId,State:LifecycleState,Health:HealthStatus,AZ:AvailabilityZone}' \
  --output table
```

**Expected Output:**

```
-------------------------------------------------------------------------
|              DescribeAutoScalingGroups                                |
+------+------------------+----------------+---------------------------+
|  AZ  |     Health       | InstanceId     |          State            |
+------+------------------+----------------+---------------------------+
| us-east-1a | Healthy    | i-0abc123...   | InService                 |
| us-east-1b | Healthy    | i-0def456...   | Pending (or InService)    |
+------+------------------+----------------+---------------------------+
```

---

## Verify Instance Health

### Step 1: Wait for Health Checks

The health check grace period is 300 seconds (5 minutes). Wait for instances to pass health checks:

```bash
# Monitor target health (frontend)
watch -n 10 'aws elbv2 describe-target-health \
  --target-group-arn "arn:aws:elasticloadbalancing:us-east-1:097837480592:targetgroup/convive-iteso-frontend-tg/f292f7c46efd5b16" \
  --profile conviveiteso \
  --query "TargetHealthDescriptions[*].{InstanceId:Target.Id,Port:Target.Port,State:TargetHealth.State,Reason:TargetHealth.Reason}" \
  --output table'
```

Press `Ctrl+C` to exit the watch command.

### Step 2: Check All Targets Are Healthy

Once both instances are healthy:

```bash
aws elbv2 describe-target-health \
  --target-group-arn "arn:aws:elasticloadbalancing:us-east-1:097837480592:targetgroup/convive-iteso-frontend-tg/f292f7c46efd5b16" \
  --profile conviveiteso \
  --query "TargetHealthDescriptions[*].{InstanceId:Target.Id,Port:Target.Port,State:TargetHealth.State}" \
  --output table
```

**Expected Output:**

```
--------------------------------------------------------------
|                  DescribeTargetHealth                      |
+--------------+------------------+---------------------------+
| InstanceId   |      Port        |          State            |
+--------------+------------------+---------------------------+
| i-0abc123... |  3000            |  healthy                  |
| i-0def456... |  3000            |  healthy                  |
+--------------+------------------+---------------------------+
```

---

## Test Load Balancer Distribution

### Step 1: Get Load Balancer DNS

```bash
aws elbv2 describe-load-balancers \
  --names convive-iteso-alb \
  --profile conviveiteso \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

Or use your domain: `https://conviveitesofront.ricardonavarro.mx`

### Step 2: Run a Load Test with Siege

Install Siege if not already installed:

```bash
# macOS
brew install siege

# Ubuntu/Debian
sudo apt-get install siege
```

Run a moderate load test:

```bash
# Test with 10 concurrent users for 2 minutes
siege -c 10 -t 2M https://conviveitesofront.ricardonavarro.mx/
```

**Expected Output:**

```
Transactions:                   5,432 hits
Availability:                 100.00 %
Elapsed time:                 119.23 secs
Data transferred:              24.45 MB
Response time:                  1.09 secs
Transaction rate:              45.56 trans/sec
Throughput:                     0.21 MB/sec
Concurrency:                   49.68
Successful transactions:       5,432
Failed transactions:               0
```

### Step 3: Verify Distribution with CloudWatch Logs (Optional)

Access individual instance logs to see which instance handled requests:

```bash
# SSH into each instance and check access logs
ssh -i ~/.ssh/your-key.pem ec2-user@<instance-1-ip>
docker logs <container-id>

ssh -i ~/.ssh/your-key.pem ec2-user@<instance-2-ip>
docker logs <container-id>
```

---

## Monitor Request Distribution

### Step 1: Check Target-Level Metrics

View request counts per target:

```bash
# Get request count per target over last 10 minutes
aws cloudwatch get-metric-statistics \
  --profile conviveiteso \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCountPerTarget \
  --dimensions Name=TargetGroup,Value=targetgroup/convive-iteso-frontend-tg/f292f7c46efd5b16 \
  --start-time "$(date -u -Iseconds --date='10 minutes ago' 2>/dev/null || date -u -Iseconds -v-10M)" \
  --end-time "$(date -u -Iseconds)" \
  --period 60 \
  --statistics Sum \
  --query 'Datapoints | sort_by(@, &Timestamp)[-10:]' \
  --output table
```

### Step 2: Monitor ALB Metrics

Check overall ALB request count:

```bash
aws cloudwatch get-metric-statistics \
  --profile conviveiteso \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=app/convive-iteso-alb/<your-alb-id> \
  --start-time "$(date -u -Iseconds --date='10 minutes ago' 2>/dev/null || date -u -Iseconds -v-10M)" \
  --end-time "$(date -u -Iseconds)" \
  --period 60 \
  --statistics Sum \
  --output table
```

### Step 3: Real-Time Monitoring

For real-time monitoring during a load test:

```bash
# Terminal 1: Run the load test
siege -c 10 -t 5M https://conviveitesofront.ricardonavarro.mx/

# Terminal 2: Monitor target health
watch -n 10 'echo "=== Target Health Status ===" && aws elbv2 describe-target-health \
  --target-group-arn "arn:aws:elasticloadbalancing:us-east-1:097837480592:targetgroup/convive-iteso-frontend-tg/f292f7c46efd5b16" \
  --profile conviveiteso \
  --query "TargetHealthDescriptions[*].{InstanceId:Target.Id,HealthState:TargetHealth.State,Port:Target.Port}" \
  --output table && echo "" && echo "=== ASG Status ===" && aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names convive-iteso-frontend-asg \
  --profile conviveiteso \
  --query "AutoScalingGroups[0].{MinSize:MinSize,Desired:DesiredCapacity,MaxSize:MaxSize,Current:length(Instances)}" \
  --output table && echo "" && echo "Last updated: $(date +"%H:%M:%S")"'
```

---

## Manual Scaling Down

### Step 1: Scale Back to 1 Instance

After testing, scale back down to save costs:

```bash
# Frontend
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name convive-iteso-frontend-asg \
  --desired-capacity 1 \
  --profile conviveiteso

# Backend
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name convive-iteso-backend-asg \
  --desired-capacity 1 \
  --profile conviveiteso
```

### Step 2: Verify Scale Down

Watch as AWS terminates the extra instance:

```bash
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names convive-iteso-frontend-asg \
  --profile conviveiteso \
  --query 'AutoScalingGroups[0].Instances[*].{InstanceId:InstanceId,State:LifecycleState,Health:HealthStatus}' \
  --output table
```

You should see one instance in `Terminating` state and one in `InService`.

### Step 3: Confirm Final State

After 1-2 minutes:

```bash
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names convive-iteso-frontend-asg \
  --profile conviveiteso \
  --query 'AutoScalingGroups[0].{Desired:DesiredCapacity,CurrentInstances:length(Instances)}' \
  --output table
```

**Expected Output:**

```
------------------------------------------
| DescribeAutoScalingGroups              |
+-------------------+--------------------+
| CurrentInstances  |      Desired       |
+-------------------+--------------------+
|  1                |  1                 |
+-------------------+--------------------+
```

---

## Troubleshooting

### Issue: New Instance Stuck in "Pending" State

**Solution:** Check the user data script logs:

```bash
ssh -i ~/.ssh/your-key.pem ec2-user@<instance-ip>
sudo tail -f /var/log/cloud-init-output.log
```

### Issue: Instance Shows as "Unhealthy"

**Solution:** Check the application logs:

```bash
ssh -i ~/.ssh/your-key.pem ec2-user@<instance-ip>
docker ps
docker logs <container-id>
```

### Issue: Load Balancer Not Distributing Evenly

**Solution:**

1. Verify both targets are healthy (see Step 2 above)
2. Check ALB algorithm (default is round-robin, which should distribute evenly)
3. Ensure sufficient load - small tests may not show even distribution

---

## Summary

This guide demonstrated:

✅ **Manual scaling**: How to manually adjust ASG desired capacity
✅ **Health verification**: How to check instance and target health
✅ **Load testing**: How to generate load with Siege
✅ **Distribution monitoring**: How to verify ALB is distributing requests
✅ **Scaling down**: How to return to baseline capacity

For automatic scaling based on metrics, see the main [README.md](../README.md) and [terraform.tfvars](./terraform.tfvars) configuration.

---

## Quick Reference Commands

```bash
# Check current state
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names convive-iteso-frontend-asg --profile conviveiteso --query 'AutoScalingGroups[0].{Desired:DesiredCapacity,Current:length(Instances)}' --output table

# Scale up
aws autoscaling set-desired-capacity --auto-scaling-group-name convive-iteso-frontend-asg --desired-capacity 2 --profile conviveiteso

# Check target health
aws elbv2 describe-target-health --target-group-arn "arn:aws:elasticloadbalancing:us-east-1:097837480592:targetgroup/convive-iteso-frontend-tg/f292f7c46efd5b16" --profile conviveiteso --query 'TargetHealthDescriptions[*].{Instance:Target.Id,State:TargetHealth.State}' --output table

# Run load test
siege -c 50 -t 2M https://conviveitesofront.ricardonavarro.mx/

# Scale down
aws autoscaling set-desired-capacity --auto-scaling-group-name convive-iteso-frontend-asg --desired-capacity 1 --profile conviveiteso
```
