echo "Start building mvp tools.."
find src -name "*.java" > sources.txt
javac -cp "lib/*" -d classes @sources.txt
jar cfm Frontend.jar Frontend.txt -C classes bftsmart
jar cfm Replica.jar Replica.txt -C classes bftsmart
jar cfm ThroughputLatencyClient.jar ThroughputLatencyClient.txt -C classes bftsmart
jar cfm ThroughputLatencyServer.jar ThroughputLatencyServer.txt -C classes bftsmart
echo "Finished Compiling"
