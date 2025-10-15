import org.apache.hadoop.io.*; 
import org.apache.hadoop.mapreduce.*; 
import org.apache.hadoop.fs.*; 
import org.apache.hadoop.conf.*;

public class WordCount {
  public static class Map extends Mapper<LongWritable, Text, Text, IntWritable> {
    public void map(LongWritable k, Text v, Context c) throws java.io.IOException, InterruptedException {
      for(String w:v.toString().split(" ")) c.write(new Text(w), new IntWritable(1));
    }
  }
  public static class Reduce extends Reducer<Text, IntWritable, Text, IntWritable> {
    public void reduce(Text k, Iterable<IntWritable> v, Context c) throws java.io.IOException, InterruptedException {
      int s=0; for(IntWritable i:v) s+=i.get(); c.write(k,new IntWritable(s));
    }
  }
  public static void main(String[] a) throws Exception {
    Job j=Job.getInstance(new Configuration(),"wc");
    j.setJarByClass(WordCount.class);
    j.setMapperClass(Map.class);
    j.setReducerClass(Reduce.class);
    j.setOutputKeyClass(Text.class);
    j.setOutputValueClass(IntWritable.class);
    FileInputFormat.addInputPath(j,new Path(a[0]));
    FileOutputFormat.setOutputPath(j,new Path(a[1]));
    j.waitForCompletion(true);
  }
}
